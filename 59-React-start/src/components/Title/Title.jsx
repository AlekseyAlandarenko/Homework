import './Title.css';
import PropTypes from 'prop-types';

function Title({ level = 1, children, className = '' }) {
  const Tag = `h${level}`;
  const sizeClass = `title-h${level}`;

  return (
    <Tag className={`title ${sizeClass} ${className}`.trim()}>
      {children}
    </Tag>
  );
}

Title.propTypes = {
  level: PropTypes.oneOf([1, 2, 3]),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Title;