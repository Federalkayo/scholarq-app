/**
 * Cloud Functions (CommonJS) port of src/utils/classUtils.js.
 * Keep this in sync with the frontend version — duplicated here because
 * the functions/ package builds independently of src/.
 *
 * Matches a student record against a teacher's assignedClasses, handling
 * variations like:
 * - "Class 10A", "Grade 10 Section A", "Grade 10 A", "10A", "Grade 10"
 */
function isStudentInTeacherClasses(student, assignedClasses = []) {
  if (!assignedClasses || assignedClasses.length === 0) return true;
  if (!student) return false;

  const grade = (student.grade || "").trim();
  const section = (student.section || "").trim();

  // Primary combinations
  const full1 = `${grade} ${section}`.trim(); // "Grade 10 Section A"
  const secLetter = section.replace(/^Section\s*/i, "").trim(); // "A"
  const gradeNum = grade.replace(/^Grade\s*/i, "").trim(); // "10"
  const short1 = `Class ${gradeNum}${secLetter}`.trim(); // "Class 10A"
  const short2 = `${gradeNum}${secLetter}`.trim(); // "10A"
  const gradeOnly = grade; // "Grade 10"

  return assignedClasses.some((ac) => {
    if (!ac) return false;
    const normAc = ac.trim();
    const normAcLower = normAc.toLowerCase();
    const fullLower = full1.toLowerCase();

    return (
      normAc === full1 ||
      normAc === short1 ||
      normAc === short2 ||
      normAc === gradeOnly ||
      fullLower.includes(normAcLower) ||
      normAcLower.includes(fullLower) ||
      (gradeNum && normAcLower.includes(gradeNum.toLowerCase()) && secLetter && normAcLower.includes(secLetter.toLowerCase()))
    );
  });
}

module.exports = { isStudentInTeacherClasses };
