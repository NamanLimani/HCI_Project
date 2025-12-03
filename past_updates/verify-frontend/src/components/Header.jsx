import logo from '../assets/icons/logo.svg'
import settingsIcon from '../assets/icons/settings-icon.svg'

export default function Header({ onSettingsClick }) {
  return (
    <div className="flex justify-between items-center mb-5">
      <div className="flex items-center gap-2 text-primary">
        <img src={logo} alt="Verify logo" width="24" height="24" />
        <h1 className="text-xl font-semibold text-gray-900">Verify</h1>
      </div>
      
      <button 
        onClick={onSettingsClick}
        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all"
      >
        <img src={settingsIcon} alt="Settings" width="20" height="20" />
      </button>
    </div>
  )
}

