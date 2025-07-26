import './Paragraph.css';
import PropTypes from 'prop-types';

function Paragraph({ size = 'regular', children, className = '' }) {
  return (
    <p className={`paragraph paragraph-${size} ${className}`}>
      {children}
    </p>
  );
}

Paragraph.propTypes = {
  size: PropTypes.oneOf(['extra-small', 'regular', 'large']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Paragraph;