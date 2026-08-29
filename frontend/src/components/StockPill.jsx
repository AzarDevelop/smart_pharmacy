// Turns a stock number into the label users see everywhere in the app
const StockPill = ({ stock, limit = 10 }) => {
  if (stock <= 0) return <span className="pill pill-bad">Out of stock</span>;
  if (stock <= limit) return <span className="pill pill-warn">Low stock · {stock}</span>;
  return <span className="pill pill-ok">In stock · {stock}</span>;
};

export const StatusPill = ({ status }) => {
  const map = {
    pending: 'pill-warn',
    confirmed: 'pill-ok',
    ready: 'pill-ok',
    completed: 'pill-neutral',
    cancelled: 'pill-neutral',
    rejected: 'pill-bad',
    active: 'pill-ok',
    blocked: 'pill-bad',
  };
  return <span className={`pill ${map[status] || 'pill-neutral'}`}>{status}</span>;
};

export default StockPill;
