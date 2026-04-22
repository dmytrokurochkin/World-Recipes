import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getActiveProfile } from '../api/profiles';
import "./header.css"

function Header() {
    const [activeProfileName, setActiveProfileName] = useState('No profile');

    useEffect(function() {
        function updateProfileName() {
            const active = getActiveProfile();
            setActiveProfileName(active ? active.username : 'No profile');
        }

        updateProfileName();
        window.addEventListener('focus', updateProfileName);
        window.addEventListener('wr-profile-changed', updateProfileName);

        return function() {
            window.removeEventListener('focus', updateProfileName);
            window.removeEventListener('wr-profile-changed', updateProfileName);
        };
    }, []);

    return (
    <header>
        <div className="headerContainer">
            <div className="headerLeft">
                <Link to="/">Home</Link>
                <button type="button" className="headerLinkButton" disabled>
                    Random recipe
                </button>
            </div>
            <div className="siteName">
                <h2>
                    WORLD RECIPES
                </h2>
            </div>
            <div className="headerRight">
                <input 
                    type="text" 
                    placeholder="Search recipes..." 
                    className="searchInput" 
                />
                <Link to="/profile">Favorites</Link>
                <Link to="/profiles">Profiles</Link>
                <span className="activeProfileName">{activeProfileName}</span>
            </div>
        </div>
    </header>
    )
}
export default Header