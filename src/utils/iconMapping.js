/**
 * Icon Mapping: Terra UI to MUI Icons Material
 *
 * This file provides a mapping layer to facilitate gradual migration
 * from Terra icons to MUI icons. Import icons from this file instead
 * of directly from terra-icon during the migration process.
 */

// MUI Icons
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Export with Terra-compatible names for easier migration
export const IconChevronRight = ChevronRightIcon;
export const IconChevronDown = ExpandMoreIcon;
export const IconLeft = ArrowBackIcon;
export const IconSettings = SettingsIcon;
export const IconEdit = EditIcon;
export const IconTrash = DeleteIcon;

// Default exports for direct usage
export {
  ChevronRightIcon,
  ExpandMoreIcon,
  ArrowBackIcon,
  SettingsIcon,
  EditIcon,
  DeleteIcon,
};
