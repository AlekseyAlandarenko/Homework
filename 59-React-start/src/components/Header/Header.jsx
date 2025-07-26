import './Header.css';
import PropTypes from 'prop-types';
import LogoIcon from './LogoIcon.svg';
import { classNames } from '../../utils/classNames';
import { NAV_LINKS } from '../../constants';

function Header({ className = '', badgeValue = 0 }) {
  return (
    <header className={classNames('header', className)}>
      <div className="header-logo">
        <img src={LogoIcon} alt="Логотип" aria-label="Логотип сайта" />
      </div>
      <nav className="header-nav">
        {NAV_LINKS.map((link) => (
          <div key={link.href} className="header-link-wrapper">
            <a href={link.href} className="header-link" aria-label={link.label}>
              {link.label}
              {link.icon}
            </a>
            {link.hasBadge && badgeValue > 0 && (
              <span className="header-link-badge">{badgeValue}</span>
            )}
          </div>
        ))}
      </nav>
    </header>
  );
}

Header.propTypes = {
  className: PropTypes.string,
  badgeValue: PropTypes.number,
};

Header.defaultProps = {
  badgeValue: 0,
};

export default Header;