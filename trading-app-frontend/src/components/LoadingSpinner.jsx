const LoadingSpinner = ({ message = "Loading...", size = "normal" }) => {
  const spinnerClass = size === "large" ? "spinner-border-lg" : size === "small" ? "spinner-border-sm" : "";
  const containerHeight = size === "large" ? "70vh" : "50vh";

  return (
    <div 
      className="d-flex justify-content-center align-items-center" 
      style={{ height: containerHeight, minHeight: "200px" }}
    >
      <div className="text-center">
        <div className={`spinner-border text-primary ${spinnerClass}`} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        {message && (
          <div className="mt-3">
            <p className="text-muted">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;