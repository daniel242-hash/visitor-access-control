import LoadingSpinner from './LoadingSpinner';

const Button = ({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  ...props
}) => {
  const baseClasses = 'font-medium py-2.5 px-5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${widthClass} ${disabledClass}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          {Icon && <Icon size={20} />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;