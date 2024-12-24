

import java.util.Comparator;
import java.util.Map;
import java.util.Optional;
import java.util.function.BiConsumer;
import java.util.*;
// import java.util.stream.Collector;
import java.util.stream.*;



public class Exercise2 {

    public static void main(String[] args) {
        CountryDao countryDao = InMemoryWorldDao.getInstance();
  //     
     List<City> s=countryDao.findAllCountries().stream()
                  .map(Country::getCities).map(cities -> cities.stream()
                  .max(Comparator.comparing(City::getPopulation)))
                  .filter(Optional::isPresent).map(city->city.get())
                  .collect(Collectors.toList());
        countryDao.getAllContinents().stream()
    }

}
