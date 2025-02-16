import React from 'react';
import { UserCircle, X } from 'lucide-react';

const MobileWorshipSelect = ({ 
  showSelector, 
  setShowSelector, 
  availableUsers, 
  currentUser, 
  setCurrentUser 
}) => {
  if (!showSelector) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-purple-700">Select User</h3>
          <button 
            onClick={() => setShowSelector(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          {availableUsers.map(user => (
            <button
              key={user.name}
              onClick={() => {
                setCurrentUser({
                  name: user.name,
                  role: user.role,
                  color: 'bg-purple-700 bg-opacity-20'
                });
                setShowSelector(false);
              }}
              className={`w-full p-2 rounded flex items-center gap-2 ${
                currentUser?.name === user.name
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-700 bg-opacity-20 text-purple-700'
              }`}
            >
              <UserCircle className={`w-4 h-4 ${currentUser?.name === user.name ? 'text-white' : ''}`} />
              <span>{user.name}</span>
              {user.role === 'leader' && (
                <span className="text-xs ml-auto">(Leader)</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileWorshipSelect;