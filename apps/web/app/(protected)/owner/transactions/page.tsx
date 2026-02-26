import React from "react";

const TransactionsPage = () => {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
        Transaction History
      </h1>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
        Detailed logs of all sales, returns, and payments.
      </p>

      <div className="mt-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-20 text-center">
        <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">
          Coming Soon
        </p>
        <h2 className="text-lg font-bold text-slate-600 dark:text-slate-300 mt-2">
          Advanced Transaction Audit In Progress
        </h2>
      </div>
    </div>
  );
};

export default TransactionsPage;
