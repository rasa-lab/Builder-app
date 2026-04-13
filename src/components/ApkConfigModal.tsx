import React, { useState, useRef } from 'react';
import { X, Upload, Smartphone, Check } from 'lucide-react';

interface ApkConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: any) => void;
}

export function ApkConfigModal({ isOpen, onClose, onConfirm }: ApkConfigModalProps) {
  const [icon, setIcon] = useState<string | null>(null);
  const [packageName, setPackageName] = useState('com.example.app');
  const [isOnline, setIsOnline] = useState(true);
  const [permissions, setPermissions] = useState<string[]>(['INTERNET']);
  const [showAllPermissions, setShowAllPermissions] = useState(false);
  
  // Generate 200 common Android permissions
  const allAndroidPermissions = [
    'INTERNET', 'ACCESS_NETWORK_STATE', 'CAMERA', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
    'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'RECORD_AUDIO', 'VIBRATE', 'BLUETOOTH',
    'WAKE_LOCK', 'RECEIVE_BOOT_COMPLETED', 'READ_CONTACTS', 'WRITE_CONTACTS', 'CALL_PHONE',
    'READ_PHONE_STATE', 'READ_SMS', 'SEND_SMS', 'RECEIVE_SMS', 'READ_CALENDAR',
    'WRITE_CALENDAR', 'NFC', 'USE_FINGERPRINT', 'USE_BIOMETRIC', 'BODY_SENSORS',
    'ACCESS_WIFI_STATE', 'CHANGE_WIFI_STATE', 'CHANGE_NETWORK_STATE', 'FLASHLIGHT', 'GET_ACCOUNTS',
    'READ_SYNC_SETTINGS', 'WRITE_SYNC_SETTINGS', 'READ_SYNC_STATS', 'DISABLE_KEYGUARD', 'EXPAND_STATUS_BAR',
    'GET_TASKS', 'REORDER_TASKS', 'SET_ALARM', 'SET_TIME_ZONE', 'SET_WALLPAPER',
    'SYSTEM_ALERT_WINDOW', 'WRITE_SETTINGS', 'ACCESS_LOCATION_EXTRA_COMMANDS', 'BATTERY_STATS', 'BIND_ACCESSIBILITY_SERVICE',
    'BIND_APPWIDGET', 'BIND_DEVICE_ADMIN', 'BIND_INPUT_METHOD', 'BIND_NFC_SERVICE', 'BIND_NOTIFICATION_LISTENER_SERVICE',
    'BIND_PRINT_SERVICE', 'BIND_TEXT_SERVICE', 'BIND_VPN_SERVICE', 'BIND_WALLPAPER', 'BLUETOOTH_ADMIN',
    'BLUETOOTH_PRIVILEGED', 'BROADCAST_PACKAGE_REMOVED', 'BROADCAST_SMS', 'BROADCAST_STICKY', 'BROADCAST_WAP_PUSH',
    'CALL_PRIVILEGED', 'CAPTURE_AUDIO_OUTPUT', 'CAPTURE_SECURE_VIDEO_OUTPUT', 'CAPTURE_VIDEO_OUTPUT', 'CHANGE_COMPONENT_ENABLED_STATE',
    'CHANGE_WIFI_MULTICAST_STATE', 'CLEAR_APP_CACHE', 'CONTROL_LOCATION_UPDATES', 'DELETE_CACHE_FILES', 'DELETE_PACKAGES',
    'DIAGNOSTIC', 'DUMP', 'FACTORY_TEST', 'GET_PACKAGE_SIZE', 'GLOBAL_SEARCH',
    'INSTALL_LOCATION_PROVIDER', 'INSTALL_PACKAGES', 'INSTALL_SHORTCUT', 'KILL_BACKGROUND_PROCESSES', 'LOCATION_HARDWARE',
    'MANAGE_DOCUMENTS', 'MASTER_CLEAR', 'MEDIA_CONTENT_CONTROL', 'MODIFY_AUDIO_SETTINGS', 'MODIFY_PHONE_STATE',
    'MOUNT_FORMAT_FILESYSTEMS', 'MOUNT_UNMOUNT_FILESYSTEMS', 'NFC_TRANSACTION_EVENT', 'PACKAGE_USAGE_STATS', 'PERSISTENT_ACTIVITY',
    'PROCESS_OUTGOING_CALLS', 'READ_CALL_LOG', 'READ_INPUT_STATE', 'READ_LOGS', 'READ_PHONE_NUMBERS',
    'READ_VOICEMAIL', 'REBOOT', 'RECEIVE_MMS', 'RECEIVE_WAP_PUSH', 'REQUEST_COMPANION_RUN_IN_BACKGROUND',
    'REQUEST_COMPANION_USE_DATA_IN_BACKGROUND', 'REQUEST_DELETE_PACKAGES', 'REQUEST_IGNORE_BATTERY_OPTIMIZATIONS', 'REQUEST_INSTALL_PACKAGES', 'REQUEST_PASSWORD_COMPLEXITY',
    'SEND_RESPOND_VIA_MESSAGE', 'SET_ALWAYS_FINISH', 'SET_ANIMATION_SCALE', 'SET_DEBUG_APP', 'SET_PREFERRED_APPLICATIONS',
    'SET_PROCESS_LIMIT', 'SET_TIME', 'SET_WALLPAPER_HINTS', 'SIGNAL_PERSISTENT_PROCESSES', 'STATUS_BAR',
    'TRANSMIT_IR', 'UNINSTALL_SHORTCUT', 'UPDATE_DEVICE_STATS', 'USE_SIP', 'WRITE_APN_SETTINGS',
    'WRITE_CALL_LOG', 'WRITE_GSERVICES', 'WRITE_SECURE_SETTINGS', 'WRITE_VOICEMAIL', 'ACCEPT_HANDOVER',
    'ACCESS_BACKGROUND_LOCATION', 'ACCESS_BLOBS_ACROSS_USERS', 'ACCESS_CHECKIN_PROPERTIES', 'ACCESS_MEDIA_LOCATION', 'ACTIVITY_RECOGNITION',
    'ADD_VOICEMAIL', 'ANSWER_PHONE_CALLS', 'BIND_AUTOFILL_SERVICE', 'BIND_CALL_REDIRECTION_SERVICE', 'BIND_CARRIER_MESSAGING_CLIENT_SERVICE',
    'BIND_CARRIER_MESSAGING_SERVICE', 'BIND_CARRIER_SERVICES', 'BIND_CHOOSER_TARGET_SERVICE', 'BIND_CONDITION_PROVIDER_SERVICE', 'BIND_CONTROLS',
    'BIND_DREAM_SERVICE', 'BIND_INCALL_SERVICE', 'BIND_MIDI_DEVICE_SERVICE', 'BIND_QUICK_ACCESS_WALLET_SERVICE', 'BIND_QUICK_SETTINGS_TILE',
    'BIND_REMOTEVIEWS', 'BIND_SCREENING_SERVICE', 'BIND_TELECOM_CONNECTION_SERVICE', 'BIND_TV_INPUT', 'BIND_VISUAL_VOICEMAIL_SERVICE',
    'BIND_VOICE_INTERACTION', 'BIND_VR_LISTENER_SERVICE', 'BLUETOOTH_ADVERTISE', 'BLUETOOTH_CONNECT', 'BLUETOOTH_SCAN',
    'CALL_COMPANION_APP', 'CLEAR_APP_USER_DATA', 'DELIVER_COMPANION_MESSAGES', 'EXEMPT_FROM_AUDIO_RECORD_RESTRICTIONS', 'FOREGROUND_SERVICE',
    'FOREGROUND_SERVICE_CAMERA', 'FOREGROUND_SERVICE_CONNECTED_DEVICE', 'FOREGROUND_SERVICE_DATA_SYNC', 'FOREGROUND_SERVICE_HEALTH', 'FOREGROUND_SERVICE_LOCATION',
    'FOREGROUND_SERVICE_MEDIA_PLAYBACK', 'FOREGROUND_SERVICE_MEDIA_PROJECTION', 'FOREGROUND_SERVICE_MICROPHONE', 'FOREGROUND_SERVICE_PHONE_CALL', 'FOREGROUND_SERVICE_REMOTE_MESSAGING',
    'FOREGROUND_SERVICE_SPECIAL_USE', 'FOREGROUND_SERVICE_SYSTEM_EXEMPTED', 'GET_ACCOUNTS_PRIVILEGED', 'HIDE_OVERLAY_WINDOWS', 'HIGH_SAMPLING_RATE_SENSORS',
    'INSTALL_DYNAMIC_SYSTEM', 'LOADER_USAGE_STATS', 'MANAGE_EXTERNAL_STORAGE', 'MANAGE_MEDIA', 'MANAGE_ONGOING_CALLS',
    'MANAGE_OWN_CALLS', 'MANAGE_WIFI_INTERFACES', 'MANAGE_WIFI_NETWORK_SELECTION', 'NEARBY_WIFI_DEVICES', 'OVERRIDE_WIFI_CONFIG',
    'POST_NOTIFICATIONS', 'PROVIDE_OWN_AUTOFILL_SUGGESTIONS', 'QUERY_ALL_PACKAGES', 'READ_ASSISTANT_APP_SEARCH_DATA', 'READ_BASIC_PHONE_STATE',
    'READ_HOME_APP_SEARCH_DATA', 'READ_MEDIA_AUDIO', 'READ_MEDIA_IMAGES', 'READ_MEDIA_VIDEO', 'READ_MEDIA_VISUAL_USER_SELECTED',
    'READ_NEARBY_STREAMING_POLICY', 'READ_PRECISE_PHONE_STATE', 'REQUEST_OBSERVE_COMPANION_DEVICE_PRESENCE', 'RUN_USER_INITIATED_JOBS', 'SCHEDULE_EXACT_ALARM',
    'START_FOREGROUND_SERVICES_FROM_BACKGROUND', 'START_VIEW_APP_FEATURES', 'START_VIEW_PERMISSION_USAGE', 'SUBSCRIBE_TO_KEYGUARD_LOCKED_STATE', 'UWB_RANGING',
    'UPDATE_PACKAGES_WITHOUT_USER_ACTION', 'USE_EXACT_ALARM', 'USE_FULL_SCREEN_INTENT', 'USE_ICC_AUTH_WITH_DEVICE_IDENTIFIER'
  ];

  const availablePermissions = allAndroidPermissions.slice(0, 12); // Show initial 12

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setIcon(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setBootVideo(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const togglePermission = (perm: string) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter(p => p !== perm));
    } else {
      if (permissions.length < 10) {
        setPermissions([...permissions, perm]);
      } else {
        alert("Maksimal 10 perizinan.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#18181b] shrink-0">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold">
            <Smartphone size={18} className="text-blue-500" />
            Konfigurasi APK
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          {/* Icon Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Foto / Ikon APK</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 bg-zinc-900 border border-zinc-700 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden"
            >
              {icon ? (
                <img src={icon} alt="Icon" className="w-full h-full object-cover" />
              ) : (
                <Upload size={20} className="text-zinc-500" />
              )}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleIconUpload} />
          </div>

          {/* Package Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Nama Package</label>
            <input 
              type="text" 
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            />
          </div>

          {/* Online/Offline */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Mode Aplikasi</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsOnline(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${isOnline ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
              >
                Online
              </button>
              <button 
                onClick={() => setIsOnline(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!isOnline ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
              >
                Offline
              </button>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex justify-between">
              <span>Perizinan (Maks 10)</span>
              <span className="text-xs text-zinc-500">{permissions.length}/10</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-[#09090b] border border-zinc-800 rounded-lg">
              {availablePermissions.map(perm => (
                <label key={perm} className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-zinc-200">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${permissions.includes(perm) ? 'bg-blue-500 border-blue-500' : 'border-zinc-600 bg-zinc-800'}`}>
                    {permissions.includes(perm) && <Check size={12} className="text-white" />}
                  </div>
                  <span className="truncate" title={perm}>{perm.replace('ACCESS_', '').replace('_EXTERNAL_STORAGE', '')}</span>
                </label>
              ))}
            </div>
            <button 
              onClick={() => setShowAllPermissions(true)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              + Lihat Semua Perizinan (200)
            </button>
          </div>

          {/* Boot Video */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Video Boot Animasi (Opsional)</label>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => videoInputRef.current?.click()}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-md transition-all active:scale-95 border border-zinc-700"
              >
                Pilih Video
              </button>
              <span className="text-xs text-zinc-500 truncate">
                {bootVideo ? 'Video terpilih' : 'Gunakan animasi bawaan'}
              </span>
            </div>
            <input type="file" accept="video/*" ref={videoInputRef} className="hidden" onChange={handleVideoUpload} />
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-[#18181b] flex gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all active:scale-95"
          >
            Tidak
          </button>
          <button 
            onClick={() => {
              onConfirm({ icon, packageName, isOnline, permissions, bootVideo });
              onClose();
            }}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-all active:scale-95"
          >
            Iya
          </button>
        </div>
      </div>

      {/* Full Permissions Modal */}
      {showAllPermissions && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#18181b] shrink-0">
              <div className="flex items-center gap-2 text-zinc-100 font-semibold">
                Semua Perizinan (Maks 10)
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-400">{permissions.length}/10</span>
                <button onClick={() => setShowAllPermissions(false)} className="text-zinc-400 hover:text-zinc-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {allAndroidPermissions.map(perm => (
                <label key={perm} className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${permissions.includes(perm) ? 'bg-blue-500 border-blue-500' : 'border-zinc-600 bg-zinc-800'}`}>
                    {permissions.includes(perm) && <Check size={12} className="text-white" />}
                  </div>
                  <span className="truncate" title={perm}>{perm.replace('ACCESS_', '').replace('_EXTERNAL_STORAGE', '')}</span>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={permissions.includes(perm)}
                    onChange={() => togglePermission(perm)}
                  />
                </label>
              ))}
            </div>
            
            <div className="p-4 border-t border-zinc-800 bg-[#18181b] flex justify-end shrink-0">
              <button 
                onClick={() => setShowAllPermissions(false)}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-all active:scale-95"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
