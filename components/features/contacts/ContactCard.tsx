import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";

interface ContactCardProps {
  contact: {
    id: string;
    name: string;
    role: string;
    phone?: string;
    email?: string;
    address?: string;
    description?: string;
    website?: string;
  };
  onEdit?: (contact: ContactCardProps["contact"]) => void;
  onDelete?: (id: string) => void;
}

export default function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between">
          <h3 className="font-medium text-lg">{contact.name}</h3>
          
          {(onEdit || onDelete) && (
            <div className="flex space-x-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(contact)}
                  className="text-gray-400 hover:text-blue-500"
                  title="Edit contact"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              )}
              
              {onDelete && (
                <button
                  onClick={() => onDelete(contact.id)}
                  className="text-gray-400 hover:text-red-500"
                  title="Delete contact"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>
        
        {contact.description && (
          <p className="text-sm text-gray-600 mt-1">{contact.description}</p>
        )}
        
        <div className="mt-4 space-y-2">
          {contact.phone && (
            <a 
              href={`tel:${contact.phone}`} 
              className="flex items-center text-sm text-gray-600 hover:text-blue-600"
            >
              <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{contact.phone}</span>
            </a>
          )}
          
          {contact.email && (
            <a 
              href={`mailto:${contact.email}`} 
              className="flex items-center text-sm text-gray-600 hover:text-blue-600"
            >
              <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{contact.email}</span>
            </a>
          )}
          
          {contact.website && (
            <a 
              href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} 
              target="_blank"
              rel="noreferrer"
              className="flex items-center text-sm text-gray-600 hover:text-blue-600"
            >
              <GlobeAltIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{contact.website}</span>
            </a>
          )}
          
          {contact.address && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{contact.address}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}