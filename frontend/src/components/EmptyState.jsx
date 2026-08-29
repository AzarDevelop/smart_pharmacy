const EmptyState = ({ title, message, action }) => (
  <div className="empty">
    <h3>{title}</h3>
    <p className="muted">{message}</p>
    {action}
  </div>
);

export default EmptyState;
