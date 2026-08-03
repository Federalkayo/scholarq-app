const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateReportComment(student) {
  const prompt = `You are helping a teacher write a short report card comment for a student.

Student name: ${student.name}
Grade: ${student.grade} ${student.section}
Attendance rate: ${student.attendance}%

Write a warm, professional, 2-3 sentence report card comment focused on attendance and general conduct. Be encouraging but honest — do not invent academic performance, grades, or subject-specific details that weren't provided. Output only the comment text, nothing else.`;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}