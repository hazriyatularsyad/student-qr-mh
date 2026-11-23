import { render, screen } from '@testing-library/react-native';
import { IslandTitle } from '@/components/IslandTitle';

test('shows the screen title as a header', async () => {
  await render(<IslandTitle title="Detail murid" />);
  expect(screen.getByText('Detail murid')).toBeTruthy();
  expect(screen.getByRole('header')).toBeTruthy();
});

test('a long title is shortened instead of overflowing the pill', async () => {
  await render(<IslandTitle title="Pengaturan suara dan nada yang sangat panjang sekali" />);
  expect(screen.getByText(/Pengaturan suara/).props.numberOfLines).toBe(1);
});
