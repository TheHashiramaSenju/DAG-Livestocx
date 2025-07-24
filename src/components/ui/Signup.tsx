'use client';
import { useState } from 'react';
import { useRoleManagement } from '@/hooks/useUserRoles';

export default function Signup() {
  const [role, setRole] = useState<'farmer' | 'investor' | ''>('');
  const { requestRole, isLoading } = useRoleManagement();

  const submit = async () => {
    if (role) await requestRole(role);
  };

  return (
    <div className="rounded-lg border p-6">
      <h3 className="mb-4 text-lg font-bold">Request Platform Access</h3>
      <select
        className="mb-4 w-full rounded border p-2"
        onChange={(e) => setRole(e.target.value as any)}
      >
        <option value="">Select role</option>
        <option value="farmer">Farmer</option>
        <option value="investor">Investor</option>
      </select>
      <button
        disabled={isLoading || !role}
        onClick={submit}
        className="w-full rounded-lg bg-green-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {isLoading ? 'Submitting…' : 'Submit'}
      </button>
    </div>
  );
}
