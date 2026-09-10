import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function QRScanner() {
  const { scanQrCheckIn, hotels } = useApp();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [scannedResult, setScannedResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  const hotelId = parseInt(user?.hotelId || user?.id || '1');
  const hotelInfo = hotels.find(h => h.id === hotelId.toString());

  useEffect(() => {
    let scanner = null;
    
    if (scanning) {
      scanner = new Html5QrcodeScanner('reader', { 
        qrbox: { width: 250, height: 250 }, 
        fps: 5 
      });
      
      scanner.render(async (decodedText) => {
        await handleScan(decodedText);
        scanner.clear();
        setScanning(false);
      }, (error) => {
        // Ignore continuous scanning errors
      });
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error(e));
      }
    };
  }, [scanning]);

  const handleScan = async (code) => {
    const cleanCode = code ? code.trim() : '';
    if (!cleanCode) return;
    
    setLoading(true);
    try {
      const result = await scanQrCheckIn(cleanCode, hotelId);
      
      if (result && result.success) {
        setScannedResult(result);
        addToast('Check-in confirmed successfully! Guest is checked in.', 'success');
      } else {
        addToast(result?.error || 'Invalid or already checked-in QR Code for this hotel.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error processing check-in', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScannedResult(null);
    setManualCode('');
  };

  return (
    <div className="fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="text-center" style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.5rem', fontWeight: 600 }}>Guest Check-In Scanner</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {hotelInfo?.name || 'Hotel'} • Scan customer QR Pass or enter Booking ID
        </p>
      </div>

      <div className="card">
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {!scannedResult ? (
            <>
              {/* Camera Scanner Area */}
              <div style={{ width: '100%', maxWidth: 400, minHeight: 300, background: 'var(--bg)', borderRadius: 12, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 24, position: 'relative' }}>
                
                {scanning ? (
                  <div id="reader" style={{ width: '100%' }}></div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 24 }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>📷</div>
                    <button className="btn btn-primary" onClick={() => setScanning(true)}>
                      Start Camera Scanner
                    </button>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 12 }}>Requires camera permissions</p>
                  </div>
                )}
              </div>

              {/* Manual Fallback */}
              <div style={{ width: '100%', maxWidth: 400, borderTop: '1px solid var(--border-light)', paddingTop: 24 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manual Entry (Booking ID / QR Code)</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 1 or BK-..." 
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && handleScan(manualCode)}
                    disabled={loading}
                    style={{ padding: '10px 14px' }}
                  />
                  <button 
                    className="btn btn-accent" 
                    onClick={() => handleScan(manualCode)} 
                    disabled={loading || !manualCode.trim()}
                    style={{ padding: '10px 20px' }}
                  >
                    {loading ? 'Verifying...' : 'Verify & Check-In'}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  Enter the numeric <strong>Booking ID</strong> or the full <strong>QR Code string</strong> from the customer's pass.
                </p>
              </div>
            </>
          ) : (
            
            /* Success Result View */
            <div className="fade-in" style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 24px' }}>
                ✓
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Check-In Confirmed!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>The guest booking has been successfully verified & checked-in.</p>
              
              <div style={{ background: 'var(--bg)', padding: 24, borderRadius: 12, textAlign: 'left', marginBottom: 24, border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Guest Name</span>
                  <strong style={{ fontSize: '1rem' }}>{scannedResult.booking.customerName || 'Guest'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Status</span>
                  <span className="badge badge-success" style={{ textTransform: 'uppercase' }}>Checked In</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Booking ID</span>
                  <strong style={{ fontSize: '1rem', fontFamily: 'monospace' }}>#{scannedResult.booking.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Stay Dates</span>
                  <strong style={{ fontSize: '0.9rem' }}>
                    {scannedResult.booking.check_in || scannedResult.booking.checkIn || 'Dates on file'} ➔ {scannedResult.booking.check_out || scannedResult.booking.checkOut || 'Checkout'}
                  </strong>
                </div>
              </div>

              <button className="btn btn-outline btn-block" onClick={resetScanner}>
                Scan Next Guest
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
