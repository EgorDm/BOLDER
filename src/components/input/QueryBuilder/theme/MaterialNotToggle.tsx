import { Checkbox } from "@mui/material";
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import type { ComponentPropsWithoutRef } from 'react';
import type { NotToggleProps } from 'react-querybuilder';

type MaterialNotToggleProps = NotToggleProps & ComponentPropsWithoutRef<typeof Switch>;

export const MaterialNotToggle = ({
  className,
  handleOnChange,
  label,
  checked,
  title,
  disabled,
  // Props that should not be in extraProps
  path: _path,
  context: _context,
  validation: _validation,
  testID: _testID,
  ...extraProps
}: MaterialNotToggleProps) => (
  <FormControlLabel
    className={className}
    title={title}
    disabled={disabled}
    control={
      <Checkbox
        checked={!!checked}
        onChange={e => handleOnChange(e.target.checked)}
        {...extraProps}
      />
    }
    label={label ?? /* istanbul ignore next */ ''}
  />
);

MaterialNotToggle.displayName = 'MaterialNotToggle';
