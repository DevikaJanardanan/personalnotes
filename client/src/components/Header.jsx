import DateStamp from './DateStamp';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const firstName = user?.name?.split(' ')[0];

  return (
    <header className="masthead">
      <div className="masthead__top">
        <div>
          <h1 className="brand">Notes.</h1>
          <p className="kicker">Personal notebook{firstName ? ` · ${firstName}` : ''}</p>
        </div>
        <div className="masthead__right">
          <DateStamp />
          {user && (
            <button className="link-btn" onClick={logout} title="Log out">
              <Icon name="logout" size={14} /> Log out
            </button>
          )}
        </div>
      </div>
      <hr className="rule" />
    </header>
  );
}
