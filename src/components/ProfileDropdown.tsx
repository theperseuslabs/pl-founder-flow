import { useRef, useEffect } from 'react';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userPhoto: string;
  userName: string;
  onSignOut: () => void;
  email: string;
}

export const ProfileDropdown = ({ isOpen, onClose, userPhoto, userName, onSignOut, email }: ProfileDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ff-profile-dropdown" ref={dropdownRef}>
      <div className="ff-profile-dropdown-header">
        <img
          src={userPhoto}
          alt={userName}
          className="ff-profile-dropdown-avatar"
        />
        <div className="ff-profile-dropdown-info">
          <div className="ff-profile-dropdown-name">{userName}</div>
          <div className="ff-profile-dropdown-email">{email}</div>
        </div>
      </div>
      <div className="ff-profile-dropdown-divider"></div>
      <button
        onClick={onSignOut}
        className="ff-profile-dropdown-item"
      >
        Sign Out
      </button>
    </div>
  );
}; 