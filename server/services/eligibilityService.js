/**
 * Co-op Eligibility Service
 * 
 * Determines if a student is eligible for co-op credit based on:
 * - Minimum GPA of 2.0
 * - Internship must be at least 7 weeks
 * - Total hours must be at least 140 (weeks * hours_per_week >= 140)
 * - Transfer students: must have completed at least ONE semester
 * - Non-transfer students: must have completed at least TWO semesters
 */

function checkCoopEligibility(student, position) {
  const reasons = [];

  // Check GPA
  if (student.gpa < 2.0) {
    reasons.push(`GPA ${student.gpa} is below minimum requirement of 2.0`);
  }

  // Check weeks
  if (position.number_of_weeks < 7) {
    reasons.push(`Internship duration of ${position.number_of_weeks} weeks is below minimum requirement of 7 weeks`);
  }

  // Check total hours
  const totalHours = position.number_of_weeks * position.hours_per_week;
  if (totalHours < 140) {
    reasons.push(`Total hours ${totalHours} is below minimum requirement of 140 hours`);
  }

  // Check semester requirement based on transfer status
  // We'll use credit_hours as a proxy for semesters completed
  // Assuming ~15 credit hours per semester
  const estimatedSemesters = Math.floor(student.credit_hours / 15);
  
  if (student.is_transfer) {
    if (estimatedSemesters < 1) {
      reasons.push(`Transfer student must have completed at least one semester at the college`);
    }
  } else {
    if (estimatedSemesters < 2) {
      reasons.push(`Non-transfer student must have completed at least two semesters at the college`);
    }
  }

  const isEligible = reasons.length === 0;
  const reason = reasons.length > 0 ? reasons.join('; ') : null;

  return {
    eligible: isEligible,
    reason: reason
  };
}

module.exports = { checkCoopEligibility };

