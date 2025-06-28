import { PlusCircle } from "lucide-react";
import { Companion } from "../../types";
import { relationshipOptions, ageRangeOptions } from "../../utils/constants";

interface CompanionSectionProps {
  companions: Companion[];
  onAddCompanion: () => void;
  onUpdateCompanion: (
    index: number,
    field: keyof Companion,
    value: string | boolean
  ) => void;
  onRemoveCompanion: (index: number) => void;
  canAutoApprove: boolean;
}

export const CompanionSection = ({
  companions,
  onAddCompanion,
  onUpdateCompanion,
  onRemoveCompanion,
  canAutoApprove,
}: CompanionSectionProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">
          Who's joining you?
        </label>
        <button
          type="button"
          onClick={onAddCompanion}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center"
        >
          <PlusCircle className="w-4 h-4 mr-1" />
          Add Person
        </button>
      </div>

      {companions.length === 0 ? (
        <div className="text-gray-500 text-sm py-4 border border-dashed border-gray-300 rounded-md text-center">
          Click "Add Person" to include companions in this reservation
        </div>
      ) : (
        <div className="space-y-4 max-h-60 overflow-y-auto">
          {companions.map((companion, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-md p-4 bg-gray-50"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Person {index + 1}
                  {companion.invite_sent_at && (
                    <span className="ml-2 text-xs text-green-600">
                      (✉️ Invited)
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveCompanion(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={companion.name}
                    onChange={(e) =>
                      onUpdateCompanion(index, "name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Relationship
                  </label>
                  <select
                    value={companion.relationship}
                    onChange={(e) =>
                      onUpdateCompanion(index, "relationship", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {relationshipOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Age Range
                  </label>
                  <select
                    value={companion.age_range}
                    onChange={(e) =>
                      onUpdateCompanion(index, "age_range", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {ageRangeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={companion.email}
                    onChange={(e) =>
                      onUpdateCompanion(index, "email", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={companion.phone}
                    onChange={(e) =>
                      onUpdateCompanion(index, "phone", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="md:col-span-2">
                  {companion.email && (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={companion.invited_to_system || false}
                        onChange={(e) =>
                          onUpdateCompanion(
                            index,
                            "invited_to_system",
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-xs text-gray-600">
                        {canAutoApprove
                          ? "Send them an invitation to join the system as a guest"
                          : "Send invitation once this reservation is approved"}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {companions.length > 0 && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-700">
            <strong>Total party size:</strong>{" "}
            {companions.filter((c) => c.name.trim()).length + 1} people
            (including you)
          </p>
          {companions.filter((c) => c.email && c.invited_to_system).length >
            0 && (
            <p className="text-xs text-green-700 mt-1">
              📧{" "}
              {companions.filter((c) => c.email && c.invited_to_system).length}{" "}
              invitation(s) will be sent{" "}
              {canAutoApprove ? "immediately" : "once approved"}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
