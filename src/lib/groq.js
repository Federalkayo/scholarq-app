const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateReportComment(student) {
  if (!GROQ_API_KEY) {
    throw new Error('VITE_GROQ_API_KEY is missing. Please restart your Vite dev server to load the .env file.');
  }

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

export async function generatePrincipalSummary({ totalStudents, todayRate, sectionRows = [], fees = [] }) {
  if (!GROQ_API_KEY) {
    throw new Error('VITE_GROQ_API_KEY is missing. Please restart your Vite dev server to load the .env file.');
  }

  const sectionDetails = sectionRows
    .map((s) => `- ${s.section}: ${s.studentCount} students, ${s.attendancePct}% attendance today`)
    .join('\n');

  const totalInvoices = fees.length;
  const paidInvoices = fees.filter((f) => f.status === 'Paid').length;
  const overdueInvoices = fees.filter((f) => f.status === 'Overdue').length;

  const prompt = `You are an AI Executive Assistant providing a daily institutional summary for Dr. Sarah J, Principal of EduAdmin Pro.

Here are the live institutional stats:
- Total Enrolled Students: ${totalStudents}
- Today's Overall Attendance Rate: ${todayRate}%
- Section Performance Breakdown:
${sectionDetails || 'No section breakdown available'}
- Fee Collection Status: ${paidInvoices} paid, ${overdueInvoices} overdue out of ${totalInvoices} total records.

Task: Write a concise, executive 3-4 sentence principal briefing. Summarize overall operational health, highlight any section or attendance concerns, and note financial collection status. Be direct, professional, and encouraging. Output only the report body text.`;

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
      max_tokens: 300
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function generateParentMessage({ studentName, guardianName, issueType, tone, details }) {
  if (!GROQ_API_KEY) {
    throw new Error('VITE_GROQ_API_KEY is missing. Please restart your Vite dev server to load the .env file.');
  }

  const prompt = `You are writing an SMS/WhatsApp/email message to a parent/guardian on behalf of Scholarq School Administration.

Guardian Name: ${guardianName || 'Parent/Guardian'}
Student Name: ${studentName}
Notice Type: ${issueType} (e.g. Fee Payment Reminder, Unexcused Absence, Positive Milestone, General Update)
Desired Tone: ${tone} (e.g. Empathetic, Formal, Direct, Urgent)
Additional Context/Details: ${details || 'None provided'}

Task: Write a concise, professional message (2-4 sentences) tailored to the specified tone. State the purpose clearly and include a friendly sign-off from Scholarq School Admin. Do not use placeholders. Output ONLY the message text.`;

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
      max_tokens: 250
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function askScholarBot({ query, history = [], schoolData = null }) {
  if (!GROQ_API_KEY) {
    throw new Error('VITE_GROQ_API_KEY is missing. Please restart your Vite dev server to load the .env file.');
  }

  let dataContext = 'No live database records retrieved yet.';
  if (schoolData) {
    dataContext = `LIVE SCHOOL DATABASE CONTEXT (Current Real-time Data):
- Enrolled Students Total: ${schoolData.totalStudents || 0}
- Student Roster & Records:
${schoolData.studentsList?.length > 0 ? schoolData.studentsList.join('\n') : 'No student records in database'}

- Tuition & Fee Financial Receivables:
  * Total Collected Amount: $${(schoolData.totalCollected || 0).toLocaleString()}
  * Total Outstanding Amount: $${(schoolData.totalOutstanding || 0).toLocaleString()}
  * Overdue Invoices (${schoolData.overdueInvoices?.length || 0} records):
${schoolData.overdueInvoices?.length > 0 ? schoolData.overdueInvoices.join('\n') : 'No overdue invoices'}
  * Pending Invoices (${schoolData.pendingInvoices?.length || 0} records):
${schoolData.pendingInvoices?.length > 0 ? schoolData.pendingInvoices.join('\n') : 'No pending invoices'}`;
  }

  const systemMessage = {
    role: 'system',
    content: `You are ScholarBot, the intelligent AI Administrative Assistant for Scholarq (EduAdmin Pro), a school management platform.

${dataContext}

STRICT INSTRUCTIONS:
1. You MUST answer all questions about students, classes, fee payments, outstanding balances, and attendance using the LIVE SCHOOL DATABASE CONTEXT above.
2. NEVER guess, assume, or fabricate fake hypothetical figures (like "500 students" or "$15,000 outstanding") when discussing this school's records. ALWAYS state the exact real figures from the data provided.
3. Be clear, helpful, and professional. Use formatting like bullet points or bold text.`
  };

  const formattedHistory = history.map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));

  const messages = [systemMessage, ...formattedHistory, { role: 'user', content: query }];

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function generateFinancialInsights(invoices = []) {
  if (!GROQ_API_KEY) {
    throw new Error('VITE_GROQ_API_KEY is missing. Please restart your Vite dev server to load the .env file.');
  }

  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const paidInvoices = invoices.filter((i) => i.status === 'Paid');
  const overdueInvoices = invoices.filter((i) => i.status === 'Overdue');
  const pendingInvoices = invoices.filter((i) => i.status === 'Pending');

  const paidAmount = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const collectionRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  const prompt = `You are a Senior Financial Advisor & School Bursar AI for Scholarq School Management.

Analyze the current live tuition fee collection dataset:
- Total Invoices Recorded: ${totalInvoices}
- Total Receivables Value: $${totalAmount.toLocaleString()}
- Collected Total: $${paidAmount.toLocaleString()} (${collectionRate}% Collection Rate)
- Overdue Invoices: ${overdueInvoices.length} invoices totaling $${overdueAmount.toLocaleString()}
- Pending Invoices: ${pendingInvoices.length} invoices totaling $${pendingAmount.toLocaleString()}

Task: Provide an executive 3-part financial forecast & recovery briefing:
1. 📈 Cash Flow Forecast (Short 2-sentence outlook for the upcoming period based on paid vs overdue ratio)
2. ⚠️ Key Risk Area (Identify the main vulnerability e.g. overdue growth or pending delay)
3. 🎯 3 Actionable Fee Recovery Recommendations (Bullet points with clear, practical steps for bursars/administrators)

Keep the language professional, encouraging, analytical, and direct. Output formatted in clean Markdown.`;

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
      max_tokens: 450
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}