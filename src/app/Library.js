import Link from 'next/link'
import SheetsLibrary from "../sheets";

const Library = ({}) => {
  return (
    <div>
      {SheetsLibrary.map((music) => {
        return <Link href={`/sheets/${music.id}`}>{music.title}</Link>;
      })}
    </div>
  );
};

export default Library;
