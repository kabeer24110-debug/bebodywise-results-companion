import { Compass } from 'lucide-react';
import { Container } from '../components/Layout';
import { EmptyState, LinkButton } from '../components/ui';

export default function NotFound() {
  return (
    <Container className="py-16">
      <EmptyState icon={<Compass size={22} />} title="We couldn’t find that page" action={<LinkButton to="/">Back to home</LinkButton>}>
        The link may be out of date, or the item may have been removed from this browser.
      </EmptyState>
    </Container>
  );
}
