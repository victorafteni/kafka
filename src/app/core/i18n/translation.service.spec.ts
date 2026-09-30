import { TestBed } from '@angular/core/testing';
import { TranslationService } from './translation.service';
import { TranslatePipe } from './translate.pipe';

describe('TranslationService & TranslatePipe', () => {
  let service: TranslationService;
  let pipe: TranslatePipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TranslationService, TranslatePipe]
    });
    service = TestBed.inject(TranslationService);
    pipe = TestBed.inject(TranslatePipe);
    service.setLanguage('ro');
  });

  it('should initialize with default language and translate keys in Romanian', () => {
    expect(service.currentLang()).toBe('ro');
    expect(service.translate('NAV.HOME')).toBe('Acasă');
    expect(service.translate('NAV.PRODUCTS')).toBe('Telefoane & Accesorii');
  });

  it('should change language to English and translate accurately', () => {
    service.setLanguage('en');
    expect(service.currentLang()).toBe('en');
    expect(service.translate('NAV.HOME')).toBe('Home');
    expect(service.translate('NAV.PRODUCTS')).toBe('Phones & Accessories');
    expect(service.translate('COMMON.IN_STOCK')).toBe('In stock');
  });

  it('should handle parameter interpolation', () => {
    service.setLanguage('ro');
    const result = service.translate('COMMON.ITEMS');
    expect(result).toBe('produse');
  });

  it('should fall back to key when translation key does not exist', () => {
    expect(service.translate('NON_EXISTENT_KEY')).toBe('NON_EXISTENT_KEY');
  });

  it('should work with TranslatePipe', () => {
    service.setLanguage('ro');
    expect(pipe.transform('CART.TITLE')).toBe('Coșul Tău de Cumpărături');

    service.setLanguage('en');
    expect(pipe.transform('CART.TITLE')).toBe('Your Shopping Cart');
  });
});
