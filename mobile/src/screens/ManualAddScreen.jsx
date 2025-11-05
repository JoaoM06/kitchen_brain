import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import SafeScreen from '../components/SafeScreen';
import FooterNav from '../components/FooterNav';

export default function NovoItemScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [secoes, setSecoes] = useState({
    armario: false,
    freezer: false,
    geladeira: false,
    despensa: false,
  });
  const [categoria, setCategoria] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validade, setValidade] = useState('');

  const categorias = [
    { label: 'Produto de limpeza', value: 'limpeza' },
    { label: 'Proteína', value: 'proteina' },
    { label: 'Proteína vegetal', value: 'proteina_vegetal' },
    { label: 'Frios', value: 'frios' },
    { label: 'Laticínios', value: 'laticinios' },
  ];

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setValidade(selectedDate.toLocaleDateString('pt-BR'));
    }
  };

  const toggleSecao = (key) => {
    setSecoes({ ...secoes, [key]: !secoes[key] });
  };

  const handleAddItem = () => {
    console.log({
      nome,
      secoes,
      categoria,
      validade,
    });

    Alert.alert(
      'Sucesso',
      'Item adicionado com sucesso!',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Stock'),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.voltar}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.titulo}>Novo item</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Nome */}
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome do item"
          placeholderTextColor="#888"
          value={nome}
          onChangeText={setNome}
        />

        {/* Seções */}
        <Text style={styles.label}>Seção</Text>
        <View style={styles.checkContainer}>
          {Object.keys(secoes).map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.checkItem}
              onPress={() => toggleSecao(key)}
            >
              <Ionicons
                name={secoes[key] ? 'checkbox' : 'square-outline'}
                size={22}
                color="#2ecc71"
              />
              <Text style={styles.checkText}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Categoria */}
        <Text style={styles.label}>Categoria</Text>
        <Dropdown
          style={styles.dropdown}
          data={categorias}
          labelField="label"
          valueField="value"
          placeholder="Selecione a categoria"
          placeholderStyle={{ color: '#888' }}
          value={categoria}
          onChange={(item) => setCategoria(item.value)}
        />

        {/* Validade */}
        <Text style={styles.label}>Validade</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: validade ? '#000' : '#888' }}>
            {validade || 'DD/MM/AAAA'}
          </Text>
          <Ionicons
            name="calendar-outline"
            size={20}
            color="#888"
            style={styles.calendarIcon}
          />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}

        {/* Botão */}
        <TouchableOpacity style={styles.btnAdd} onPress={handleAddItem}>
          <Text style={styles.btnText}>Adicionar item</Text>
        </TouchableOpacity>
      </View>

      <FooterNav active="NovoItemScreen" onNavigate={navigation.replace} /> 
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 6,
  },
  voltar: { color: '#2ecc71', fontSize: 16 },
  titulo: { fontSize: 20, fontWeight: '600' },
  label: { fontSize: 14, color: '#555', marginBottom: 5, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
  },
  checkContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5 },
  checkItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 8 },
  checkText: { marginLeft: 6, fontSize: 15 },
  calendarIcon: { position: 'absolute', right: 10 },
  btnAdd: { backgroundColor: '#209b53ff', paddingVertical: 14, borderRadius: 42, marginTop: 40 },
  btnText: { color: '#fff', fontWeight: '600', textAlign: 'center', fontSize: 16 },
});
