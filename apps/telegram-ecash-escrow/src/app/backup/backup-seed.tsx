import { styled } from '@mui/material/styles';

const WordAlignment = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  columnGap: '1rem',
  rowGap: '1rem',
  '.word': {
    padding: '0.5rem',
    borderRadius: '8px',
    '.word-number': {
      color: 'gray',
      fontSize: '12px'
    },
    '.word-letter': {
      fontSize: '14px',
      color: theme.custom.colorItem
    },
    '&.wrong': {
      background: 'red !important'
    },
    '&.right': {
      background: `${theme.custom.bgItem5} !important`
    },
    '&.blur': {
      filter: 'blur(3px)'
    },
    '&.not-blur': {
      filter: 'blur(0)'
    }
  }
}));

export type BackupWordModel = {
  word: string;
  isBlur: boolean;
  isCorrect: boolean;
};

type BackupSeedProps = {
  mnemonicWords?: BackupWordModel[];
  isPlayGame?: boolean;
};

const BackupSeed = ({ mnemonicWords, isPlayGame }: BackupSeedProps) => {
  return (
    <WordAlignment>
      {mnemonicWords &&
        mnemonicWords.map((word, index) => {
          return (
            <div
              key={index}
              className={`word ${word.isBlur && isPlayGame ? 'blur' : 'not-blur'} ${
                word.isCorrect ? 'right' : 'wrong'
              }`}
            >
              <span className="word-number">{index + 1}</span>&nbsp;
              <span className="word-letter">{word.word}</span>
            </div>
          );
        })}
    </WordAlignment>
  );
};

export default BackupSeed;
