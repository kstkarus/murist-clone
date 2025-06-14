import { FiUser } from 'react-icons/fi';

interface TeamMemberProps {
  name: string;
  position: string;
  photo: string | null;
  bio: string;
}

export default function TeamMember({ name, position, photo, bio }: TeamMemberProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="w-24 h-24 rounded-lg object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
            <span className="text-3xl text-gray-500">{name[0].toUpperCase()}</span>
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-600 mt-1">{position}</p>
          <p className="text-sm text-gray-700 mt-2">{bio}</p>
        </div>
      </div>
    </div>
  );
} 