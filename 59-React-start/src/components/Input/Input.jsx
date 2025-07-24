import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Input.css';

const Input = forwardRef(function Input(
  {
    isValid,
    appearance = 'text',
    icon = null,
    className = '',
    inputClassName = '',
    ...props
  },
  ref
) {
  const inputClasses = [
    'input',
    appearance && `input-${appearance}`,
    icon && 'input-with-icon',
    isValid === false && 'invalid',
    inputClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`input-wrapper ${className}`.trim()}>
      {icon && <span className="input-icon">{icon}</span>}
      <input
        ref={ref}
        className={inputClasses}
        {...props}
      />
    </div>
  );
});

Input.propTypes = {
  isValid: PropTypes.bool,
  appearance: PropTypes.oneOf(['text', 'title']),
  icon: PropTypes.node,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
};

export default Input;