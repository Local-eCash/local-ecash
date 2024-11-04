import styled from '@emotion/styled';
import Button from '@mui/material/Button';

const ButtonStyled = styled(Button)`
  min-width: 220px;
  padding: 0.5rem 1rem;
  color: #fff;
  background: var(--color-primary);
  font-size: 14px;
  text-transform: capitalize;
  border-radius: 1rem;
  .anticon-custom {
    svg {
      filter: var(--filter-svg-white-color) !important;
    }
  }

  &:disabled {
    background-color: rgba(30, 26, 29, 0.12);
    color: var(--text-color-on-dark) !important;
    border-color: transparent;

    &:hover {
      background: rgba(30, 26, 29, 0.12);
      border-color: transparent;
    }
  }

  &.outline-btn {
    color: var(--color-primary) !important;
    background: transparent !important;
    border: 1px solid var(--border-color-dark-base);

    &:hover {
      background: rgba(158, 42, 156, 0.08);
      color: var(--color-primary);
    }

    &:disabled {
      background-color: var(--bg-color-dark-item);
      border-color: var(--border-color-dark-base);
      color: var(--text-color-on-dark);
    }
  }

  &.no-border-btn {
    color: var(--color-primary) !important;
    background: transparent !important;

    &:hover {
      background: rgba(158, 42, 156, 0.08) !important;
    }

    &:disabled {
      background-color: transparent;
      border: 0;
      color: var(--text-color-on-dark);
    }
  }

  &:hover {
    color: var(--color-primary) !important;
    background: var(--border-color-dark-base) !important;
  }
`;

export function LixiButton({
  title,
  classCustom,
  icon,
  onClickItem
}: {
  title?: string;
  classCustom?: string;
  icon?: any;
  onClickItem?: () => void;
}) {
  return (
    <ButtonStyled className={classCustom} onClick={onClickItem}>
      {icon && icon} &nbsp;
      {title}
    </ButtonStyled>
  );
}

export default LixiButton;
