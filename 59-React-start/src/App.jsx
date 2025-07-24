import './App.css';
import { useState } from 'react';
import Title from './components/Title/Title';
import Paragraph from './components/Paragraph/Paragraph';
import Button from './components/Button/Button';
import Input from './components/Input/Input';
import SearchIcon from './components/Input/search.svg';

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    alert(`Вы ищете: ${searchQuery}`);
  };

  return (
    <div className="app">
      <Title level={1}>Поиск</Title>
      <Paragraph size="regular">
        Введите название фильма, сериала или мультфильма для поиска и добавления в избранное.
      </Paragraph>

      <div className="search-row">
        <div className="input-wrapper-fixed">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Введите название"
            appearance="text"
            icon={<img src={SearchIcon} alt="Поиск" />}
          />
        </div>
        <Button onClick={handleSearch}>Искать</Button>
      </div>
    </div>
  );
}

export default App;



