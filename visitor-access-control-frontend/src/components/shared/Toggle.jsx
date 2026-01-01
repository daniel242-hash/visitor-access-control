const Toggle = ({ enabled, onChange, loading = false, label }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={loading}
      className={`${
        enabled ? 'bg-accent-500' : 'bg-gray-300'
      } relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span className="sr-only">{label}</span>
      <span
        className={`${
          enabled ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-lg`}
      />
    </button>
  );
};

export default Toggle;