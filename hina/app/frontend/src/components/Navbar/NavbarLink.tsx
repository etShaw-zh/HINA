import { Tooltip, UnstyledButton } from '@mantine/core';
import classes from './NavbarMinimalColored.module.css';

interface NavbarLinkProps {
  icon: React.FC<{ stroke?: number }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton onClick={onClick} className={classes.link} data-active={active || undefined}>
        <Icon stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

export default NavbarLink;
