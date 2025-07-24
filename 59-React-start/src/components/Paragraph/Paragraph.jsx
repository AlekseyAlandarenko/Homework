import './Paragraph.css';
import { memo } from 'react';
import PropTypes from 'prop-types';

function Paragraph({ size = 'regular', children, className = '' }) {
  const sizeClass = `paragraph-${size}`;

  return (
    <p className={`paragraph ${sizeClass} ${className}`.trim()}>
      {children}
    </p>
  );
}

Paragraph.propTypes = {
  size: PropTypes.oneOf(['extra-small', 'regular', 'large']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default memo(Paragraph);