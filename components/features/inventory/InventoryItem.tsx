import React from 'react';

// Define the props for the InventoryItem component
interface InventoryItemProps {
    id: string; // Unique identifier for the inventory item
    name: string; // Name of the inventory item
    quantity: number; // Quantity of the inventory item
    onUpdate: (id: string, quantity: number) => void; // Function to update the item quantity
    onDelete: (id: string) => void; // Function to delete the item
}

// InventoryItem component for displaying individual inventory items
const InventoryItem: React.FC<InventoryItemProps> = ({ id, name, quantity, onUpdate, onDelete }) => {
    const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newQuantity = parseInt(event.target.value);
        if (!isNaN(newQuantity)) {
            onUpdate(id, newQuantity); // Call the update function with the new quantity
        }
    };

    return (
        <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
                <span className="mr-4">{name}</span>
                <label htmlFor={`quantity-${id}`} className="mr-2">Quantity:</label>
                <input
                    id={`quantity-${id}`}
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="border rounded p-1 w-16"
                    aria-label={`Quantity for ${name}`}
                    min="0"
                />
            </div>
            <button
                onClick={() => onDelete(id)} // Call the delete function when clicked
                className="bg-red-500 text-white rounded px-4 py-2"
            >
                Delete
            </button>
        </div>
    );
};

export default InventoryItem;