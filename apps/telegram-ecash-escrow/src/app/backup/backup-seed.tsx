import styled from '@emotion/styled';

const WordAlignment = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  column-gap: 1rem;
  row-gap: 1rem;
  .word {
    padding: 0.5rem;
    border-radius: 8px;
    .word-number {
      color: gray;
      font-size: 12px;
    }
    .word-letter {
      font-size: 14px;
      color: #fff;
    }
    &.wrong {
      background: red !important;
    }
    &.right {
      background: #2c2c2c !important;
    }
    &.blur {
      filter: blur(3px);
    }
    &.not-blur {
      filter: blur(0);
    }
  }
`;

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
