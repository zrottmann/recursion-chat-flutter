import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';

const VerifiedBadge = ({ isVerified, size = 'sm', showText = false }) => {
  if (!isVerified) return null;

  const tooltip = (
    <Tooltip id="verified-tooltip">
      <strong>Verified Human</strong>
      <br />
      This user has an active $5/month membership and is verified as a real person.
      <br />
      Higher priority in AI matches and trusted by the community.
    </Tooltip>
  );

  const iconSize = size === 'lg' ? '20px' : size === 'md' ? '16px' : '14px';

  return (
    <OverlayTrigger _placement="top" overlay={tooltip}>
      <Badge 
        bg="primary" 
        className="verified-badge d-inline-flex align-items-center"
        style={{ 
          cursor: 'help',
          fontSize: size === 'lg' ? '0.9rem' : size === 'md' ? '0.8rem' : '0.7rem',
          padding: size === 'lg' ? '6px 8px' : size === 'md' ? '4px 6px' : '3px 5px'
        }}
      >
        <i 
          className="fas fa-check-circle me-1" 
          style={{ 
            fontSize: iconSize,
            color: '#fff'
          }}
        ></i>
        {showText && (
          <span style={{ fontWeight: '600' }}>
            Verified Human
          </span>
        )}
      </Badge>
    </OverlayTrigger>
  );
};

export default VerifiedBadge;