'use client';
import { AddCircleOutline } from '@mui/icons-material';
import { Fab } from '@mui/material';
import { useRouter } from 'next/navigation';

const fabStyle = {
  position: 'absolute',
  bottom: 16,
  right: 16
};

interface FabProps {
  route: string;
  icon?: any;
}

const FloatingActionButton: React.FC<FabProps> = ({ route, icon }) => {
  const router = useRouter();

  return (
    <Fab onClick={() => router.push(route)} color="primary" aria-label="add" sx={fabStyle}>
      {icon ? icon : <AddCircleOutline />}
    </Fab>
  );
};

export default FloatingActionButton;
