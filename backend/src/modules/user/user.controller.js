import asyncHandler from '../../utils/asyncHandler.js';
import User from '../../models/User.js';

/**
 * @route   GET /api/users/profile
 * @desc    Get currently authenticated user's detailed profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    user: user.toSafeObject(),
  });
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile data
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const {
    name,
    phone,
    dateOfBirth,
    gender,
    bloodGroup,
    address,
    emergencyContact,
    allergies,
    chronicConditions,
    // Professional fields
    specialty,
    licenseNumber,
    qualifications,
    hospitalAffiliation,
    department,
    yearsOfExperience,
  } = req.body;

  if (name !== undefined) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth.trim();
  if (gender !== undefined) user.gender = gender.trim();
  if (bloodGroup !== undefined) user.bloodGroup = bloodGroup.trim();
  if (address !== undefined) user.address = address.trim();

  if (emergencyContact !== undefined && typeof emergencyContact === 'object') {
    user.emergencyContact = {
      name: emergencyContact.name ? emergencyContact.name.trim() : (user.emergencyContact?.name || ''),
      phone: emergencyContact.phone ? emergencyContact.phone.trim() : (user.emergencyContact?.phone || ''),
      relationship: emergencyContact.relationship ? emergencyContact.relationship.trim() : (user.emergencyContact?.relationship || ''),
    };
  }

  if (Array.isArray(allergies)) {
    user.allergies = allergies.map((a) => (typeof a === 'string' ? a.trim() : '')).filter(Boolean);
  }

  if (Array.isArray(chronicConditions)) {
    user.chronicConditions = chronicConditions.map((c) => (typeof c === 'string' ? c.trim() : '')).filter(Boolean);
  }

  // Clinical fields updated if user is PROFESSIONAL or ADMIN
  if (user.role === 'PROFESSIONAL' || user.role === 'ADMIN') {
    if (specialty !== undefined) user.specialty = specialty.trim();
    if (licenseNumber !== undefined) user.licenseNumber = licenseNumber.trim();
    if (qualifications !== undefined) user.qualifications = qualifications.trim();
    if (hospitalAffiliation !== undefined) user.hospitalAffiliation = hospitalAffiliation.trim();
    if (department !== undefined) user.department = department.trim();
    if (yearsOfExperience !== undefined) {
      const parsedExp = parseInt(yearsOfExperience, 10);
      user.yearsOfExperience = isNaN(parsedExp) ? null : parsedExp;
    }
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: user.toSafeObject(),
  });
});
