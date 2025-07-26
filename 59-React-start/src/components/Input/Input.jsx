import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Input.css';
import { classNames } from '../../utils/classNames';

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
  const inputClasses = classNames(
    'input',
    appearance && `input-${appearance}`,
    icon && 'input-with-icon',
    isValid === false && 'input-invalid',
    inputClassName
  );

  return (
    <div className={classNames('input-wrapper', className)}>
      {icon && <span className="input-icon">{icon}</span>}
      <input
        ref={ref}
        className={inputClasses}
        aria-invalid={isValid === false}
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