import './Button.css';
import PropTypes from 'prop-types';

function Button({ children, onClick, className = '' }) {
  return (
    <button type="button" className={`button ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default Button;