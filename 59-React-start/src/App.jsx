import './App.css';
import Title from './components/Title/Title';
import Paragraph from './components/Paragraph/Paragraph';
import Button from './components/Button/Button';

function App() {
	return (
		<div className="app">
			<Title level={1}>Поиск</Title>
			<Paragraph size="regular">
				Введите название фильма, сериала или мультфильма для поиска и добавления в избранное.
			</Paragraph>
			<Button onClick={() => alert('Кнопка нажата!')}>
				Искать
			</Button>
		</div>
	);
}

export default App;



