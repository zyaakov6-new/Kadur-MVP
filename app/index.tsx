import { View } from 'react-native';
import { LoadingState } from '../components/ui/LoadingState';

export default function Index() {
    return (
        <View style={{ flex: 1, backgroundColor: '#050B08' }}>
            <LoadingState />
        </View>
    );
}
