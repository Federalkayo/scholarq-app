import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import StatusChip from '../components/ui/StatusChip';
import Avatar from '../components/ui/Avatar';
import { mockFeeInvoices } from '../data/mockData';

export default function Fees() {
  const { searchQuery } = useOutletContext();
  const [invoices] = useState(mockFeeInvoices);
  const [sentReminderId, setSentReminderId] = useState(null);
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateBars(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const feeTrendData = [
    { month: 'Jun', expectedHeight: '50%', collectedHeight: '40%', amount: '$80k' },
    { month: 'Jul', expectedHeight: '65%', collectedHeight: '55%', amount: '$95k' },
    { month: 'Aug', expectedHeight: '75%', collectedHeight: '65%', amount: '$110k' },
    { month: 'Sep', expectedHeight: '88%', collectedHeight: '78%', amount: '$120k' },
    { month: 'Oct', expectedHeight: '100%', collectedHeight: '88%', amount: '$124k' }
  ];

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.studentName.toLowerCase().includes(q) ||
      inv.studentId.toLowerCase().includes(q) ||
      inv.classSec.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q)
    );
  });

  const handleSendReminder = (id) => {
    setSentReminderId(id);
    setTimeout(() => setSentReminderId(null), 3000);
  };

  return (
    <div class="p-xl max-w-container-max mx-auto animate-fadeIn">
      {/* Notification Toast */}
      {sentReminderId && (
        <div class="fixed bottom-6 right-6 bg-primary text-on-primary px-lg py-md rounded-lg shadow-xl z-50 flex items-center gap-md animate-fadeIn">
          <span class="material-symbols-outlined text-secondary-fixed">check_circle</span>
          <span class="font-label-md">Payment reminder successfully sent!</span>
        </div>
      )}

      {/* Page Title & Header Actions */}
      <div class="flex flex-wrap justify-between items-end mb-lg gap-md">
        <div>
          <h2 class="font-display-lg text-display-lg text-primary">Fee Management</h2>
          <p class="text-on-surface-variant font-body-md">
            Monitor and collect tuition fees for the Academic Year 2023-24.
          </p>
        </div>
        <div class="flex gap-sm">
          <button class="bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md px-md py-sm rounded-lg flex items-center gap-xs hover:bg-surface-container-high transition-all">
            <span class="material-symbols-outlined">filter_list</span>
            Filter
          </button>
          <button
            onClick={() => handleSendReminder('ALL')}
            class="bg-secondary text-on-secondary font-label-md px-md py-sm rounded-lg flex items-center gap-xs hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <span class="material-symbols-outlined">send</span>
            Send Reminder
          </button>
        </div>
      </div>

      {/* Dashboard Analytics Grid */}
      <div class="grid grid-cols-12 gap-lg mb-lg">
        {/* Summary Stats */}
        <div class="col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div class="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover-lift">
            <p class="text-label-sm text-on-surface-variant uppercase mb-xs font-bold">Total Outstanding</p>
            <h3 class="text-headline-md font-display-lg text-primary">$42,850</h3>
            <p class="text-[12px] text-error mt-xs flex items-center gap-xs font-bold">
              <span class="material-symbols-outlined text-[14px]">trending_up</span>
              +5.2% vs last month
            </p>
          </div>
          <div class="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover-lift">
            <p class="text-label-sm text-on-surface-variant uppercase mb-xs font-bold">Collected (MTD)</p>
            <h3 class="text-headline-md font-display-lg text-secondary">$124,200</h3>
            <p class="text-[12px] text-secondary mt-xs flex items-center gap-xs font-bold">
              <span class="material-symbols-outlined text-[14px]">trending_up</span>
              +12% vs last month
            </p>
          </div>
        </div>

        {/* Animated Collection Chart */}
        <div class="col-span-12 lg:col-span-8 bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover-lift">
          <div class="flex justify-between items-center mb-md">
            <h4 class="font-headline-sm text-on-surface">Fee Collection Trend</h4>
            <div class="flex gap-md text-[12px]">
              <span class="flex items-center gap-xs">
                <span class="w-3 h-3 rounded-full bg-primary"></span> Expected
              </span>
              <span class="flex items-center gap-xs">
                <span class="w-3 h-3 rounded-full bg-secondary"></span> Collected
              </span>
            </div>
          </div>
          <div class="h-40 relative flex items-end justify-between gap-4 group border-b border-outline-variant px-4 pt-4">
            {feeTrendData.map((d) => (
              <div key={d.month} class="flex-1 flex flex-col items-center gap-sm h-full justify-end relative group/bar">
                {/* Tooltip */}
                <div class="absolute -top-8 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-primary text-on-primary text-xs px-2 py-1 rounded shadow-md pointer-events-none z-20">
                  {d.amount}
                </div>
                <div class="w-full max-w-[48px] bg-primary/20 rounded-t-md relative h-full flex items-end overflow-hidden">
                  <div
                    class="w-full bg-primary rounded-t-md transition-all duration-1000 ease-out absolute bottom-0"
                    style={{ height: animateBars ? d.expectedHeight : '0%' }}
                  >
                    <div
                      class="w-full bg-secondary rounded-t-md transition-all duration-1000 ease-out absolute bottom-0"
                      style={{ height: animateBars ? d.collectedHeight : '0%' }}
                    ></div>
                  </div>
                </div>
                <span class="text-xs text-on-surface-variant font-bold">{d.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fee Invoices Data Table */}
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant">
                <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Student</th>
                <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Class</th>
                <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Amount Due</th>
                <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Due Date</th>
                <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Status</th>
                <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/30">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} class="hover:bg-surface-container-low transition-colors">
                  <td class="px-lg py-md">
                    <div class="flex items-center gap-md">
                      <Avatar src={inv.avatar} initials={inv.studentName.substring(0, 2)} alt={inv.studentName} />
                      <div>
                        <p class="font-body-md text-body-md text-on-surface font-semibold">{inv.studentName}</p>
                        <p class="text-xs text-on-surface-variant">{inv.studentId}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-lg py-md font-body-md text-on-surface">{inv.classSec}</td>
                  <td class="px-lg py-md font-body-md font-bold text-on-surface">{inv.amount}</td>
                  <td class="px-lg py-md font-body-md text-on-surface-variant">{inv.dueDate}</td>
                  <td class="px-lg py-md">
                    <StatusChip status={inv.status} />
                  </td>
                  <td class="px-lg py-md">
                    <button
                      onClick={() => handleSendReminder(inv.id)}
                      title="Send Reminder"
                      class="flex items-center gap-xs text-primary hover:bg-primary-fixed px-sm py-1 rounded-lg transition-colors font-label-md text-xs active:scale-95"
                    >
                      <span class="material-symbols-outlined text-[18px]">send</span>
                      Reminder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
