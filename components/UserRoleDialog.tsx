import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  roles?: string[];
}

interface UserRoleDialogProps {
  user: User | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function UserRoleDialog({ user: selectedUser, onClose, onUpdate }: UserRoleDialogProps) {
  if (!selectedUser) return null;
  
  const handleToggleRole = async (userId: string, role: string) => {
    try {
      const hasRole = selectedUser.roles?.includes(role) || false;
      
      if (hasRole) {
        // Remove role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .match({ user_id: userId, role });
          
        if (error) throw error;
      } else {
        // Add role
        const { error } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: userId, 
            role,
            assigned_by: (await supabase.auth.getUser()).data.user?.id,
            assigned_at: new Date().toISOString()
          });
          
        if (error) throw error;
      }
      
      // Call the update callback
      onUpdate();
      
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Manage User: {selectedUser.email}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">Assign or remove roles:</p>
            
            {['owner', 'manager', 'family', 'guest'].map(role => {
              const hasRole = selectedUser.roles?.includes(role) || false;
              
              return (
                <div key={role} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`role-${role}`}
                    checked={hasRole}
                    onChange={() => handleToggleRole(selectedUser.id, role)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor={`role-${role}`} className="ml-2 text-gray-700 capitalize">
                    {role}
                  </label>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}