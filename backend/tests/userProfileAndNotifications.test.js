import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../src/app.js';
import User from '../src/models/User.js';
import Notification from '../src/models/Notification.js';
import { generateToken } from '../src/utils/token.js';
import { COOKIE_NAME } from '../src/config/env.js';
import { createNotification } from '../src/services/notification.service.js';

let mongod;
let server;
let baseUrl;

let patientUser;
let patientToken;

let doctorUser;
let doctorToken;

let unauthorizedUser;
let unauthorizedToken;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}/api`;

  patientUser = await User.create({
    name: 'Alice Patient',
    email: 'alice.profile@example.com',
    passwordHash: 'dummy_hash_123',
    role: 'PATIENT',
    isActive: true,
  });
  patientToken = generateToken(patientUser);

  doctorUser = await User.create({
    name: 'Dr. Evelyn Reed',
    email: 'evelyn.doctor@example.com',
    passwordHash: 'dummy_hash_456',
    role: 'PROFESSIONAL',
    isActive: true,
  });
  doctorToken = generateToken(doctorUser);

  unauthorizedUser = await User.create({
    name: 'Eve Unauthorized',
    email: 'eve@example.com',
    passwordHash: 'dummy_hash_789',
    role: 'PATIENT',
    isActive: true,
  });
  unauthorizedToken = generateToken(unauthorizedUser);
});

test.after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test('User Profile and Notification Engine Test Suite', async (t) => {
  await t.test('1. Unauthenticated request to /api/users/profile is rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/users/profile`);
    assert.equal(res.status, 401);
  });

  await t.test('2. GET /api/users/profile returns safe patient profile details', async () => {
    const res = await fetch(`${baseUrl}/users/profile`, {
      headers: { Cookie: `${COOKIE_NAME}=${patientToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.user.name, 'Alice Patient');
    assert.equal(body.user.email, 'alice.profile@example.com');
    assert.equal(body.user.role, 'PATIENT');
    assert.equal(body.user.passwordHash, undefined);
  });

  await t.test('3. PUT /api/users/profile updates patient profile fields', async () => {
    const payload = {
      name: 'Alice M. Patient',
      phone: '+91 98765 11223',
      dateOfBirth: '1992-05-15',
      gender: 'Female',
      bloodGroup: 'O+',
      address: '42 Health St, Metro City',
      emergencyContact: {
        name: 'Bob Patient',
        phone: '+91 98765 99887',
        relationship: 'Spouse',
      },
      allergies: ['Penicillin', 'Sulfa drugs'],
      chronicConditions: ['Asthma'],
    };

    const res = await fetch(`${baseUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${COOKIE_NAME}=${patientToken}`,
      },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.user.name, 'Alice M. Patient');
    assert.equal(body.user.phone, '+91 98765 11223');
    assert.equal(body.user.bloodGroup, 'O+');
    assert.equal(body.user.emergencyContact.name, 'Bob Patient');
    assert.deepEqual(body.user.allergies, ['Penicillin', 'Sulfa drugs']);
    assert.deepEqual(body.user.chronicConditions, ['Asthma']);
  });

  await t.test('4. Patient role cannot modify clinical credentials via profile update', async () => {
    const payload = {
      specialty: 'Cardiology Specialist',
      licenseNumber: 'FAKE-MCI-123',
    };

    const res = await fetch(`${baseUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${COOKIE_NAME}=${patientToken}`,
      },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    // Patient should retain empty specialty and licenseNumber
    assert.equal(body.user.specialty, '');
    assert.equal(body.user.licenseNumber, '');
  });

  await t.test('5. Clinician user can update professional practice credentials', async () => {
    const payload = {
      name: 'Dr. Evelyn Reed, MD',
      phone: '+91 98111 22334',
      specialty: 'Internal Medicine & Critical Care',
      licenseNumber: 'NMC-2024-99881',
      qualifications: 'MBBS, MD (General Medicine)',
      hospitalAffiliation: 'Central District Hospital',
      department: 'Emergency & Triage Unit',
      yearsOfExperience: 14,
    };

    const res = await fetch(`${baseUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${COOKIE_NAME}=${doctorToken}`,
      },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.user.specialty, 'Internal Medicine & Critical Care');
    assert.equal(body.user.licenseNumber, 'NMC-2024-99881');
    assert.equal(body.user.hospitalAffiliation, 'Central District Hospital');
    assert.equal(body.user.yearsOfExperience, 14);
  });

  await t.test('6. GET /api/notifications returns empty list and zero unread count initially', async () => {
    const res = await fetch(`${baseUrl}/notifications`, {
      headers: { Cookie: `${COOKIE_NAME}=${patientToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.unreadCount, 0);
    assert.equal(body.notifications.length, 0);
  });

  let notif1Id;
  let notif2Id;

  await t.test('7. Create notifications and verify retrieval with pagination and unreadCount', async () => {
    const notif1 = await createNotification({
      userId: patientUser._id,
      title: 'Consultation Intake Complete',
      message: 'Your preliminary intake summary is prepared.',
      type: 'general',
      link: '/patient/cases',
    });
    notif1Id = notif1._id.toString();

    const notif2 = await createNotification({
      userId: patientUser._id,
      title: 'Doctor Assessment Ready',
      message: 'Dr. Reed has signed your clinical assessment.',
      type: 'report_published',
      link: '/patient/cases/report',
    });
    notif2Id = notif2._id.toString();

    const res = await fetch(`${baseUrl}/notifications`, {
      headers: { Cookie: `${COOKIE_NAME}=${patientToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.unreadCount, 2);
    assert.equal(body.notifications.length, 2);
    assert.equal(body.notifications[0].title, 'Doctor Assessment Ready');
  });

  await t.test('8. Filter parameter "clinical" filters by clinical types', async () => {
    const res = await fetch(`${baseUrl}/notifications?filter=clinical`, {
      headers: { Cookie: `${COOKIE_NAME}=${patientToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.notifications.length, 1);
    assert.equal(body.notifications[0].type, 'report_published');
  });

  await t.test('9. PATCH /api/notifications/:id/read marks single notification as read', async () => {
    const res = await fetch(`${baseUrl}/notifications/${notif1Id}/read`, {
      method: 'PATCH',
      headers: { Cookie: `${COOKIE_NAME}=${patientToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.notification.isRead, true);

    // Verify unreadCount decreased
    const listRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Cookie: `${COOKIE_NAME}=${patientToken}` },
    });
    const listBody = await listRes.json();
    assert.equal(listBody.unreadCount, 1);
  });

  await t.test('10. Unauthorized user cannot mark or delete another user notification', async () => {
    const readRes = await fetch(`${baseUrl}/notifications/${notif2Id}/read`, {
      method: 'PATCH',
      headers: { Cookie: `${COOKIE_NAME}=${unauthorizedToken}` },
    });
    assert.equal(readRes.status, 404);

    const delRes = await fetch(`${baseUrl}/notifications/${notif2Id}`, {
      method: 'DELETE',
      headers: { Cookie: `${COOKIE_NAME}=${unauthorizedToken}` },
    });
    assert.equal(delRes.status, 404);
  });

  await t.test('11. PATCH /api/notifications/mark-all-read marks all user notifications as read', async () => {
    const res = await fetch(`${baseUrl}/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: { Cookie: `${COOKIE_NAME}=${patientToken}` },
    });
    assert.equal(res.status, 200);

    const listRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Cookie: `${COOKIE_NAME}=${patientToken}` },
    });
    const listBody = await listRes.json();
    assert.equal(listBody.unreadCount, 0);
  });

  await t.test('12. DELETE /api/notifications/:id deletes notification for owner', async () => {
    const delRes = await fetch(`${baseUrl}/notifications/${notif1Id}`, {
      method: 'DELETE',
      headers: { Cookie: `${COOKIE_NAME}=${patientToken}` },
    });
    assert.equal(delRes.status, 200);

    const listRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Cookie: `${COOKIE_NAME}=${patientToken}` },
    });
    const listBody = await listRes.json();
    assert.equal(listBody.total, 1);
  });
});
