
import ConversionCtrl from '../data/routes/testConverter';
import should from 'should';

describe('Converter', function() {
  describe('Integration', function() {
    it('should convert basic data', async function() {
      should(await ConversionCtrl.convertInt('5')).equal(5);
      should(await ConversionCtrl.convertStr(5)).equal('5');
    });
    it('should convert multiple', async function() {
      let result = await ConversionCtrl.convertMult({
        intVal: '5',
        strVal: 5,
        array: ['5', 5, '15'],
        object: {
          intVal: '5',
          strVal: 5,
          array: ['5', 5, '15'],
          object: {
            intVal: '5',
            strVal: 5,
            array: ['5', 5, '15'],
          }
        }
      });
      should(result).have.properties({
        intVal: 5,
        strVal: '5'
      });
      should(result).have.property('array');
      result.array.should.have.properties({
        length: 3,
        0: 5,
        1: 5,
        2: 15
      });
      /*
      result.object.should.have.properties({
        intVal: 5,
        strVal: '5'
      });
      result.object.array.should.have.properties({
        length: 3,
        0: 5,
        1: 5,
        2: 15
      });
      */
    });
    it('should rename a field', async function() {
      should(await ConversionCtrl.renameField('happy')).equal('happy');
    });
  });
});
