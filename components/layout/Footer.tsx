import React from 'react';

// Footer component for the application
const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto text-center">
                <p>&copy; {new Date().getFullYear()} Stia. All rights reserved.</p>
                <p>Manage your shared second home with ease!</p>
            </div>
        </footer>
    );
};

export default Footer;