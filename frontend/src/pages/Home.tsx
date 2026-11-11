import { useProducts } from '../hooks/useProducts';
import { ProductList } from '../components/ProductList';
import { Navbar } from '../components/Navbar';
import { ErrorDisplay } from '../components/ErrorDisplay';

export function Home() {
  const { products, loading, error, refresh } = useProducts();

  const handleAddToCart = async (_product: { id: string }) => {
    // Cart integration is handled on the Cart page.
  };

  return (
    <div className="page">
      <Navbar cartCount={0} />
      <main className="container">
        <ErrorDisplay error={error} onRetry={refresh} />
        <ProductList
          products={products}
          loading={loading}
          error={error}
          onAddToCart={handleAddToCart}
          onRefresh={refresh}
        />
      </main>
    </div>
  );
}
